#!/usr/bin/env perl

use strict;
use warnings;
use JSON;
use CGI;
use FindBin;
use Cwd;

my $scriptDir = $FindBin::Bin;
if (!(chdir $scriptDir . "/../../results/")) {
  print "Status: 404 Not Found\n"; 
  print CGI::header(-type => 'application/json', -charset => 'UTF-8');
  exit(1);
}


my $basePath = Cwd::getcwd();
my $tree;
$tree = &scan_dir(".");

sub scan_dir {
  my $scan_dir_path = shift;
  $scan_dir_path =~ s/\/$//;

  chdir $scan_dir_path;
  my $tree = [];
  my @pathes = glob "*";

  foreach my $path (@pathes) {
    if( -d $path ) {
      if ( $path !~ /current/ ) {
        my $tmp_tree = {};
        $tmp_tree->{"title"} = $path;
        $tmp_tree->{"isFolder"} = "true";
        $tmp_tree->{"children"} = &scan_dir($path);
        push(@$tree, $tmp_tree);
        chdir "../";
      };
    }
    elsif (( $path =~ /.json$|.json.gz$/) && ( $path !~ /^all.json$/ )) {
         my $tmp_children ={};
         my $tmp_url = Cwd::getcwd() . "/" . $path;
         $tmp_url =~ s/$basePath//g;
         $tmp_children->{"url"} =  $tmp_url; 
         $tmp_children->{"title"} = $path;
         push(@$tree, $tmp_children);
    }
  }
  return $tree;
}


print CGI::header(-type => 'application/json', -charset => 'UTF-8');
print encode_json($tree);
